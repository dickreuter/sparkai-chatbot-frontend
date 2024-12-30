import { AxiosStatic } from "axios";

declare module "axios" {
  export interface AxiosStatic {
    post: jest.Mock;
    get: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  }
}

export default axios as jest.Mocked<AxiosStatic>;
