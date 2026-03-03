import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

// PartialType makes every field from CreateUserDto optional
// and inherits all class-validator decorators automatically
export class UpdateUserDto extends PartialType(CreateUserDto) {}
