import { z } from 'zod';

const bodySchema = z.object({ optionId: z.number().int().positive() });

export default defineEventHandler(async (event) => {
  const account = await requireAccount(event);
  const { optionId } = await readValidatedBody(event, bodySchema.parse);
  castPollVote(requiredIdParam(event), optionId, account);
  return { voted: true };
});
