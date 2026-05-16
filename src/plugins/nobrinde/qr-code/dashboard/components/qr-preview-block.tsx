interface QrAsset {
  id?: string;
  name?: string;
  preview?: string;
  source?: string;
}

interface DetailContextEntity {
  id?: string;
  customFields?: {
    qrCodeAsset?: QrAsset | null;
  };
}

function QrPreviewCard({ title, entity }: { title: string; entity?: DetailContextEntity }) {
  const qrAsset = entity?.customFields?.qrCodeAsset;
  const previewUrl = qrAsset?.preview || qrAsset?.source;

  return (
    <div className="">
      <div className="mb-3 text-sm font-medium text-muted-foreground">{title}</div>
      {previewUrl ? (
        <a href={previewUrl} target="_blank" rel="noreferrer" className="block">
          <img
            src={previewUrl}
            alt={qrAsset?.name || 'QR code'}
            className="h-44 w-full rounded-md border border-border bg-background object-contain p-2"
          />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">No QR code generated yet.</p>
      )}
    </div>
  );
}

export function ProductQrPreviewBlock({ context }: { context: { entity?: DetailContextEntity } }) {
  return <QrPreviewCard title="Product QR Code" entity={context.entity} />;
}

export function ProductVariantQrPreviewBlock({ context }: { context: { entity?: DetailContextEntity } }) {
  return <QrPreviewCard title="Variant QR Code" entity={context.entity} />;
}
