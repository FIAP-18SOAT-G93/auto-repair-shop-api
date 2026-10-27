import { Injectable } from '@nestjs/common';
import { PartRepository } from '../domain/part.repository.js';
import { type PartOutput, toPartOutput } from './part.output.js';

export interface ListPartsInput {
  onlyOutOfStock?: boolean;
  page: number;
  pageSize: number;
}

export interface ListPartsOutput {
  items: PartOutput[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListPartsUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute({
    onlyOutOfStock,
    page,
    pageSize,
  }: ListPartsInput): Promise<ListPartsOutput> {
    const { items, total } = await this.parts.list(
      { onlyOutOfStock },
      page,
      pageSize,
    );
    return { items: items.map(toPartOutput), total, page, pageSize };
  }
}
