import { DomainException } from './DomainException';

export class InvalidGainException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGainException';
    Object.setPrototypeOf(this, InvalidGainException.prototype);
  }
}
