import {
  FormFieldWrapper,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFormContext,
  useQuery,
} from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { api } from '@vendure/dashboard';
import { bannerListDocument } from '../../../../banner/banner.graphql';

export function BannerSelectorField({ name }: { name: string }) {
  const { control } = useFormContext();
  // Query active banners
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ['active-banners'],
    queryFn: () =>
      api.query(bannerListDocument, {
        options: {
          filter: {
            active: { eq: true },
          },
        },
      }),
    networkMode: 'offlineFirst',
  });

  const banners = bannersData?.banners?.items || [];

  return (
    <FormFieldWrapper
      control={control}
      name={name}
      label={<Trans>Banner</Trans>}
      render={({ field }) => (
        <Select
          value={field.value || ''}
          onValueChange={value => {
            field.onChange(value);
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading Banners...' : 'Select Banner'} />
          </SelectTrigger>
          <SelectContent>
            {banners.length === 0 ? (
              <SelectItem value={undefined} disabled>
                {isLoading ? <Trans>Loading...</Trans> : <Trans>No active banners found</Trans>}
              </SelectItem>
            ) : (
              banners.map(banner => (
                <SelectItem key={banner.id} value={banner.id}>
                  {banner.title || banner.code || banner.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    />
  );
}
