import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  TranslatableFormFieldWrapper,
  useMutation,
  toast,
  useForm,
  FormProvider,
} from '@vendure/dashboard';
import { Trans, useLingui } from '@lingui/react/macro';
import { api } from '@vendure/dashboard';
import { z } from 'zod';
import { updatePageBlockDocument, pageBlockDocument } from '../../page.graphql';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnsBuilder } from '../column/column-builder';

const columnButtonSchema = z.object({
  label: z.string(),
  type: z.enum(['external', 'internal']),
  openInNewTab: z.boolean(),
  url: z.string().optional(),
  linkRef: z
    .object({
      entity: z.string(),
      value: z.string(),
    })
    .optional(),
});

const entityFilterConditionSchema = z.discriminatedUnion('field', [
  z.object({
    field: z.literal('limit'),
    operator: z.literal('gte'),
    value: z.number().int().positive(),
  }),
  z.object({
    field: z.literal('type'),
    operator: z.literal('eq'),
    value: z.string(),
  }),
  z.object({
    field: z.literal('customFields.categoryType'),
    operator: z.literal('eq'),
    value: z.string(),
  }),
  z.object({
    field: z.literal('customFields.is_new'),
    operator: z.literal('eq'),
    value: z.boolean(),
  }),
  z.object({
    field: z.literal('customFields.is_promotion'),
    operator: z.literal('eq'),
    value: z.boolean(),
  }),
  z.object({
    field: z.literal('customFields.is_featured'),
    operator: z.literal('eq'),
    value: z.boolean(),
  }),
  z.object({
    field: z.literal('customFields.is_best_seller'),
    operator: z.literal('eq'),
    value: z.boolean(),
  }),
]);

// Discriminated union for column data based on type
const columnDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('video'),
    label: z.string().optional(),
    url: z.string().optional(),
  }),
  z.object({
    type: z.literal('image'),
    label: z.string().optional(),
    url: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    button: columnButtonSchema.optional(),
  }),
  z.object({
    type: z.literal('cta'),
    title: z.string().optional(),
    description: z.string().optional(),
    button: columnButtonSchema.optional(),
  }),
  z.object({
    type: z.literal('content'),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal('stats'),
    items: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
  }),
  z.object({
    type: z.literal('faq'),
    itemId: z.string(),
  }),
  z.object({
    type: z.literal('document'),
    itemId: z.string(),
  }),
  z.object({
    type: z.literal('banner'),
    itemId: z.string(),
  }),
  z.object({
    type: z.enum(['news', 'authors', 'collections', 'kits', 'productVariants']),
    filters: z.object({
      combinator: z.enum(['AND', 'OR']),
      conditions: z.array(entityFilterConditionSchema),
    }),
  }),
]);

const columnSchema = z.object({
  type: z.enum([
    'video',
    'image',
    'cta',
    'content',
    'stats',
    'faq',
    'document',
    'banner',
    'news',
    'authors',
    'collections',
    'kits',
    'productVariants',
  ]),
  label: z.string().optional().nullable(),
  css: z.record(z.any()).refine(data => typeof data.width === 'number', {
    message: 'CSS must include width as a number',
  }),
  data: columnDataSchema,
});

const zodSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string().optional(),
      languageCode: z.string(),
      columns: z.array(columnSchema).min(1),
    }),
  ),
});

type BlockFormData = z.infer<typeof zodSchema>;

interface BlockContentModalProps {
  open: boolean;
  onClose: () => void;
  blockId: string;
  onRefresh: () => void;
}

export function BlockContentModal({ open, onClose, blockId, onRefresh }: BlockContentModalProps) {
  const { t } = useLingui();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      translations: [],
    },
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
  });

  // Determine active language code from Vendure's i18n context.
  useEffect(() => {
    if (open && blockId) {
      setLoading(true);
      const userSettingsString =
        typeof window !== 'undefined' && window.localStorage.getItem('vendure-user-settings');
      const userSettings = userSettingsString ? JSON.parse(userSettingsString) : null;
      api
        .query(pageBlockDocument, { id: blockId })
        .then(data => {
          const block = data.pageBlock;
          form.reset({
            translations: block?.translations?.length
              ? (block.translations.map(t => ({
                  id: t.id,
                  languageCode: t.languageCode,
                  columns: t.columns || [],
                })) as never)
              : [{ languageCode: userSettings?.contentLanguage || 'en', columns: [] }],
          });
        })
        .catch((err: any) => {
          toast.error(t`Failed to load block`, { description: err.message });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, blockId, form, t]);

  const updateMutation = useMutation({
    mutationFn: api.mutate(updatePageBlockDocument),
    onSuccess: () => {
      toast.success(t`Block updated successfully`);
      onRefresh();
      onClose();
    },
    onError: (err: any) => {
      toast.error(t`Failed to update block`, { description: err.message });
    },
  });

  const handleSave = form.handleSubmit(data => {
    updateMutation.mutate({
      input: {
        id: blockId,
        translations: data.translations.map(translation => ({
          id: translation.id,
          languageCode: translation.languageCode,
          columns: translation.columns,
        })) as never,
      },
    });
  });
  // console.log('loading', loading);
  // console.log('updateMutation.isPending', updateMutation.isPending);
  // console.log('form.formState.isValid', form.formState.isValid);
  // console.log('errors', zodSchema.safeParse(form.getValues()).error);

  return (
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Trans>Block Content - Columns</Trans>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Trans>Loading...</Trans>
              </div>
            ) : (
              <>
                {/* Columns with drag and drop */}
                <TranslatableFormFieldWrapper
                  control={form.control as never}
                  // @ts-ignore - TranslatableFormFieldWrapper expects TranslatableEntity form structure, but our form works at runtime
                  name="columns"
                  // label={<Trans>Columns</Trans>}
                  render={({ field }) => <ColumnsBuilder name={field.name} />}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                (!form.formState.isValid || updateMutation.isPending || loading) && !form.formState.isDirty
              }
            >
              <Trans>Save</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
