import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeeContact } from '../database/entities/employee-contact.entity';
import { Repository } from 'typeorm';
import { EmployeeContactDto } from '../employees/dto/employee-contact.dto';

@Injectable()
export class EmployeeContactsService {
  constructor(
    @InjectRepository(EmployeeContact)
    private contactRepository: Repository<EmployeeContact>,
  ) {}

  async createOrUpdateContact(
    employeeId: string,
    contactData: EmployeeContactDto,
  ) {
    const contact = await this.contactRepository.findOne({
      where: { employee: { id: employeeId } },
    });

    if (contact) {
      contact.phone = contactData.phone;
      contact.address = contactData.address;
      contact.emergencyContact = contactData.emergencyContact;
      contact.emergencyPhone = contactData.emergencyPhone;
      await this.contactRepository.save(contact);
    } else {
      const newContact = this.contactRepository.create({
        phone: contactData.phone,
        address: contactData.address,
        emergencyContact: contactData.emergencyContact,
        emergencyPhone: contactData.emergencyPhone,
      });
      await this.contactRepository.save(newContact);
    }

    return { message: 'Contact information updated successfully' };
  }
}
