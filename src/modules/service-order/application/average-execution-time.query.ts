import { Injectable } from '@nestjs/common';
import type { ServiceItem } from '../domain/service-item.js';
import { ServiceOrderRepository } from '../domain/service-order.repository.js';

export interface ExecutionTimeAverage {
  averageMinutes: number | null;
  orders: number;
}

export interface ServiceExecutionTimeAverage extends ExecutionTimeAverage {
  serviceId: string;
  name: string;
}

export interface AverageExecutionTimeOutput {
  overall: ExecutionTimeAverage;
  byService: ServiceExecutionTimeAverage[];
}

interface ExecutedOrder {
  durationMs: number;
  services: readonly ServiceItem[];
}

const MINUTE_MS = 60_000;

function toAverage(durationsMs: readonly number[]): ExecutionTimeAverage {
  if (durationsMs.length === 0) return { averageMinutes: null, orders: 0 };
  const total = durationsMs.reduce((sum, duration) => sum + duration, 0);
  const minutes = total / durationsMs.length / MINUTE_MS;
  return {
    averageMinutes: Math.round(minutes * 10) / 10,
    orders: durationsMs.length,
  };
}

function averageByService(
  executed: readonly ExecutedOrder[],
): ServiceExecutionTimeAverage[] {
  const groupedServices = new Map<
    string,
    { name: string; durations: number[] }
  >();
  for (const order of executed) {
    const uniqueServices = new Map(
      order.services.map((service) => [service.serviceId, service]),
    );
    for (const service of uniqueServices.values()) {
      const entry = groupedServices.get(service.serviceId);
      if (entry) {
        entry.durations.push(order.durationMs);
      } else {
        groupedServices.set(service.serviceId, {
          name: service.name,
          durations: [order.durationMs],
        });
      }
    }
  }
  return [...groupedServices]
    .map(([serviceId, { name, durations }]) => ({
      serviceId,
      name,
      ...toAverage(durations),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

@Injectable()
export class AverageExecutionTimeQuery {
  constructor(private readonly orders: ServiceOrderRepository) {}

  async execute(): Promise<AverageExecutionTimeOutput> {
    const executed = (await this.orders.listFinished()).flatMap(
      (order): ExecutedOrder[] => {
        const durationMs = order.getExecutionTime();
        return durationMs === null
          ? []
          : [{ durationMs, services: order.approvedServiceItems }];
      },
    );
    return {
      overall: toAverage(executed.map((order) => order.durationMs)),
      byService: averageByService(executed),
    };
  }
}
