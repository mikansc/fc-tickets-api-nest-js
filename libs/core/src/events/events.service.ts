import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

import { ReserveSpotDto } from './dto/reserve-spot.dto';
import { Prisma, SpotStatus, TicketStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}

  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
      },
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({
      where: { id },
    });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prismaService.event.update({
      where: { id },
      data: { ...updateEventDto, date: new Date(updateEventDto.date) },
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({
      where: { id },
    });
  }

  async reserveSpot(dto: ReserveSpotDto & { eventId: string }) {
    const spots = await this.prismaService.spot.findMany({
      where: {
        eventId: dto.eventId,
        name: {
          in: dto.spots,
        },
      },
    });

    if (spots.length !== dto.spots.length) {
      const foundSpotsName = spots.map((spot) => spot.name);
      const notFoundSpotsName = dto.spots.filter(
        (spotName) => !foundSpotsName.includes(spotName),
      );

      throw new Error(`Spots ${notFoundSpotsName.join(', ')} not found.`);
    }

    try {
      const tickets = await this.prismaService.$transaction(
        async (prismaTransaction) => {
          await prismaTransaction.reservationHistory.createMany({
            data: spots.map((spot) => ({
              spotId: spot.id,
              ticketKind: dto.ticket_kind,
              email: dto.email,
              status: TicketStatus.reserved,
            })),
          });

          await prismaTransaction.spot.updateMany({
            where: {
              id: {
                in: spots.map((spot) => spot.id),
              },
            },
            data: {
              status: SpotStatus.reserved,
            },
          });

          const persistedTickets = await Promise.all(
            spots.map((spot) =>
              prismaTransaction.ticket.create({
                data: {
                  email: dto.email,
                  spotId: spot.id,
                  ticketKind: dto.ticket_kind,
                },
              }),
            ),
          );

          return persistedTickets;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // ler registros que já foram comitados, importane quando tem update many (só quero lidar com dados definitivos no banco)
        },
      );

      return tickets;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // unique constraint violation
          case 'P2034': // transaction conflict
            throw new ForbiddenException('Some spots are already reserved');
          default:
            throw new InternalServerErrorException(
              'Something went wrong on creating spot',
            );
        }
      }

      throw error;
    }
  }
}
