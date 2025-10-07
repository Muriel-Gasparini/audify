import { DomainException } from './DomainException';

export class InvalidTargetLevelException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTargetLevelException';
    Object.setPrototypeOf(this, InvalidTargetLevelException.prototype);
  }
}
