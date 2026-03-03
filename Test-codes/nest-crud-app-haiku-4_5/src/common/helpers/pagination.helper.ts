import { Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class PaginationHelper {
  getPaginationParams(
    skip: string | number = 0,
    take: string | number = 10,
  ): { skip: number; take: number } {
    const skipNum = Math.max(0, Number(skip) || 0);
    const takeNum = Math.min(100, Math.max(1, Number(take) || 10));

    return { skip: skipNum, take: takeNum };
  }

  addSearchFilter<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    searchFields: string[],
    searchTerm: string,
  ): SelectQueryBuilder<T> {
    if (!searchTerm || searchTerm.trim() === '') {
      return query;
    }

    return query.andWhere(
      new Brackets((qb) => {
        searchFields.forEach((field, index) => {
          if (index === 0) {
            qb.where(`${field} ILIKE :search`, {
              search: `%${searchTerm}%`,
            });
          } else {
            qb.orWhere(`${field} ILIKE :search`, {
              search: `%${searchTerm}%`,
            });
          }
        });
      }),
    );
  }
}
