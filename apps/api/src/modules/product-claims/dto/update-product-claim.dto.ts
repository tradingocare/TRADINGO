import { PartialType } from '@nestjs/swagger';
import { CreateProductClaimDto } from './create-product-claim.dto';

export class UpdateProductClaimDto extends PartialType(CreateProductClaimDto) {}
