import { ModuleMocker } from 'jest-mock'

export function createMockInstance<T extends new (...arguments_: any) => any> (cl: T): InstanceType<T> {
  const moduleMocker = new ModuleMocker(global)
  const metadata = moduleMocker.getMetadata(cl)
  if (metadata == null) {
    throw new Error('Metadata should be defined')
  }

  const Mock = moduleMocker.generateFromMetadata(metadata)
  return new Mock() as InstanceType<T>
}
