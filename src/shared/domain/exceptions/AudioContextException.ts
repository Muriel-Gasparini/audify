import { DomainException } from './DomainException';

export class AudioContextException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'AudioContextException';
    Object.setPrototypeOf(this, AudioContextException.prototype);
  }
}
