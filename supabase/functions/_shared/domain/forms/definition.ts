import { z } from 'zod'

/**
 * A digital form definition, as the bank's own forms platform publishes it.
 *
 * Baz does not reimplement a product journey. It reads the definition the existing web journey
 * reads, works out which questions apply to this customer, and collects them in conversation.
 * The definition stays the contract; this is another renderer of it.
 *
 * Deliberately permissive. The real SuperSaver definition carries 499 fields and far more
 * metadata than is needed here (styling, placement, help text, analytics hooks), and a schema
 * that insisted on knowing every key would break the first time the bank published a revision.
 * What is parsed is what is used.
 */

/** The handful of operators the real definition actually uses, confirmed across 540 rules. */
export const LOGIC_OPERATORS = ['is', 'isnot'] as const
export type LogicOperator = (typeof LOGIC_OPERATORS)[number]

export const conditionalRuleSchema = z.object({
  fieldId: z.union([z.string(), z.number()]).transform(String),
  operator: z.enum(LOGIC_OPERATORS),
  value: z.unknown(),
})

export const conditionalLogicSchema = z.object({
  /** `show` means the field appears when the rules pass; `hide` means it disappears. */
  actionType: z.enum(['show', 'hide']),
  /** `all` is every rule; `any` is at least one. */
  logicType: z.enum(['all', 'any']),
  rules: z.array(conditionalRuleSchema),
})

export const choiceSchema = z.object({
  text: z.string(),
  /**
   * The value the form platform expects back.
   *
   * Never the label, and never anything the model composed. A choice answer is resolved to one
   * of these or it is not an answer (§17.2 of the feature note).
   */
  value: z.string(),
  isSelected: z.boolean().optional(),
})

/**
 * The platform serialises "nothing here" as an empty string, not as null.
 *
 * Measured across the real SuperSaver definition: 418 of 499 fields carry `choices: ""`, 252
 * carry `conditionalLogic: ""`, and one carries `conditionalLogic: false`. A schema that
 * insisted on null would reject the definition outright, which is not a theory — it is what
 * happened the first time this was parsed.
 */
const blankAs = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((value) => {
    if (value === '' || value === false || value === null) return undefined
    return value
  }, inner.optional())

export const formFieldSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.string(),
  label: z.string().optional().default(''),
  isRequired: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
  choices: blankAs(z.array(choiceSchema)),
  inputs: blankAs(
    z.array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        label: z.string().optional(),
      }),
    ),
  ),
  conditionalLogic: blankAs(conditionalLogicSchema),
  defaultValue: z.unknown().optional(),
  pageNumber: z.number().optional(),
  /** The downstream mapping the bank's own platform carries. Recorded, never interpreted. */
  toscana: z.unknown().optional(),
})

export const formDefinitionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  fields: z.array(formFieldSchema),
  /** Transient, issued per retrieval. Travels with a submission; never shown unmasked. */
  nonce: z.string().optional(),
})

export type ConditionalLogic = z.infer<typeof conditionalLogicSchema>
export type FormChoice = z.infer<typeof choiceSchema>
export type FormField = z.infer<typeof formFieldSchema>
export type FormDefinition = z.infer<typeof formDefinitionSchema>
