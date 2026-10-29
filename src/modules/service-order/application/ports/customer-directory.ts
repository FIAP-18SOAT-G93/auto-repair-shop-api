export interface CustomerRef {
  id: string;
}

export interface VehicleRef {
  id: string;
  customerId: string;
}

export interface NewCustomer {
  document: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface NewVehicle {
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
}

export abstract class CustomerDirectory {
  abstract findCustomerByDocument(
    document: string,
  ): Promise<CustomerRef | null>;
  abstract registerCustomer(input: NewCustomer): Promise<CustomerRef>;
  abstract findVehicleByPlate(plate: string): Promise<VehicleRef | null>;
  abstract registerVehicle(input: NewVehicle): Promise<VehicleRef>;
}
