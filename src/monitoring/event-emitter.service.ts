import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { EmployeeChangeEvent } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class EventEmitterService {
  private eventSubject = new Subject<EmployeeChangeEvent>();
  public events$: Observable<EmployeeChangeEvent> =
    this.eventSubject.asObservable();

  emit(event: EmployeeChangeEvent) {
    this.eventSubject.next(event);
  }

  getObservable(): Observable<EmployeeChangeEvent> {
    return this.events$;
  }
}
