import { DomainEventPublisher } from '../../../shared/domain/events/DomainEventPublisher';
import { NormalizerActivatedEvent } from '../../../shared/domain/events/NormalizerActivatedEvent';
import { ConfigurationChangedEvent } from '../../../shared/domain/events/ConfigurationChangedEvent';
import { AudioConfig } from '../../domain/value-objects/AudioConfig';

export class EventPublisherService {
  constructor(private readonly eventPublisher: DomainEventPublisher) {}

  public publishActivationChanged(isActive: boolean): void {
    this.eventPublisher.publish(new NormalizerActivatedEvent(isActive));
  }

  public publishConfigurationChanged(config: AudioConfig): void {
    this.eventPublisher.publish(
      new ConfigurationChangedEvent({
        targetLevel: config.targetLevel.getValue(),
        maxGain: config.maxGain.getValue(),
        minGain: config.minGain.getValue(),
      })
    );
  }
}
