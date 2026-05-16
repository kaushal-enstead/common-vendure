import { api, Button, toast, useMutation, useQueryClient } from '@vendure/dashboard';
import { QrCode } from 'lucide-react';

const GENERATE_PRODUCT_QR_MUTATION = `
  mutation GenerateProductQrCode($productId: ID!) {
    generateProductQrCode(productId: $productId)
  }
`;

const GENERATE_ALL_QR_MUTATION = `
  mutation GenerateProductAndVariantsQrCodes($productId: ID!) {
    generateProductAndVariantsQrCodes(productId: $productId)
  }
`;

interface ProductDetailButtonProps {
  context: { entity?: { id: string } };
}

export function ProductGenerateQrButton({ context }: ProductDetailButtonProps) {
  const queryClient = useQueryClient();
  const productId = context.entity?.id;

  const { mutate: generateQr, isPending } = useMutation({
    mutationFn: (id: string) => api.mutate(GENERATE_PRODUCT_QR_MUTATION, { productId: id }),
    onSuccess: data => {
      if (data?.generateProductQrCode) {
        toast.success('Product QR code generated');
        queryClient.invalidateQueries();
      } else {
        toast.error('Failed to generate product QR code');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to generate product QR code');
    },
  });

  return (
    <Button variant="secondary" disabled={!productId || isPending} onClick={() => productId && generateQr(productId)}>
      {!isPending && <QrCode className="mr-2 h-4 w-4" />}
      {isPending ? 'Generating...' : 'Generate Product QR'}
    </Button>
  );
}

export function ProductGenerateAllQrButton({ context }: ProductDetailButtonProps) {
  const queryClient = useQueryClient();
  const productId = context.entity?.id;

  const { mutate: generateAllQr, isPending } = useMutation({
    mutationFn: (id: string) => api.mutate(GENERATE_ALL_QR_MUTATION, { productId: id }),
    onSuccess: data => {
      if (data?.generateProductAndVariantsQrCodes) {
        toast.success('Product and variants QR codes generated');
        queryClient.invalidateQueries();
      } else {
        toast.error('Failed to generate all QR codes');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to generate all QR codes');
    },
  });

  return (
    <Button
      variant="secondary"
      disabled={!productId || isPending}
      onClick={() => productId && generateAllQr(productId)}
    >
      {!isPending && <QrCode className="mr-2 h-4 w-4" />}
      {isPending ? 'Generating...' : 'Generate All QRs'}
    </Button>
  );
}
