import { ModuleMocker } from 'jest-mock'

export function createMockInstance<T extends new (...args: any) => any> (cl: T): InstanceType<T> {
  const moduleMocker = new ModuleMocker(global)
  const metadata = moduleMocker.getMetadata(cl)!
  const Mock = moduleMocker.generateFromMetadata(metadata)
  return new Mock() as InstanceType<T>
}
