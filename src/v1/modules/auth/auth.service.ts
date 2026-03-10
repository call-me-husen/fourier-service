import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EmployeeService } from '../employees/employee.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { Employee } from '../../../shared/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    private employeeService: EmployeeService,
    private jwtService: JwtService,
  ) {}

  async signIn(dto: LoginDto) {
    const employee = await this.employeeService.findByEmail(dto.email);

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      employee.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.generateAccessToken(employee),
    };
  }

  private generateAccessToken(employee: Employee) {
    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
    };

    return this.jwtService.sign(payload);
  }
}
