import { useState } from 'react';
import {
  Button,
  Input,
  AssetPickerDialog,
  VendureImage,
  assetFragment,
  AssetFragment,
  useFormContext,
  useQuery,
} from '@vendure/dashboard';
import { Image as ImageIcon, FileText, FileSpreadsheet, File, ExternalLink, Video } from 'lucide-react';
import { Trans } from '@lingui/react/macro';
import { graphql } from '@/gql';
import { api } from '@vendure/dashboard';

const assetByIdDocument = graphql(
  `
    query AssetById($id: ID!) {
      asset(id: $id) {
        ...Asset
      }
    }
  `,
  [assetFragment],
);

// File type detection and icon mapping
type FileTypeInfo = {
  icon: React.ReactNode;
  label: string;
};

function getFileTypeInfo(url: string): FileTypeInfo | null {
  if (!/^https?:\/\//i.test(url)) return null;

  const extension = url.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/i)?.[1];
  if (!extension) return null;

  // Document types with appropriate icons and colors
  const fileTypes: Record<string, FileTypeInfo> = {
    pdf: { icon: <FileText className="size-8 text-red-500" />, label: 'PDF Document' },
    doc: { icon: <FileText className="size-8 text-blue-500" />, label: 'Word Document' },
    docx: { icon: <FileText className="size-8 text-blue-500" />, label: 'Word Document' },
    xls: { icon: <FileSpreadsheet className="size-8 text-green-500" />, label: 'Excel Spreadsheet' },
    xlsx: { icon: <FileSpreadsheet className="size-8 text-green-500" />, label: 'Excel Spreadsheet' },
    csv: { icon: <FileSpreadsheet className="size-8 text-green-500" />, label: 'CSV File' },
    ppt: { icon: <FileText className="size-8 text-orange-500" />, label: 'PowerPoint Presentation' },
    pptx: { icon: <FileText className="size-8 text-orange-500" />, label: 'PowerPoint Presentation' },
    txt: { icon: <FileText className="size-8 text-gray-500" />, label: 'Text Document' },
    rtf: { icon: <FileText className="size-8 text-gray-500" />, label: 'Rich Text Document' },
    zip: { icon: <File className="size-8 text-purple-500" />, label: 'ZIP Archive' },
    rar: { icon: <File className="size-8 text-purple-500" />, label: 'RAR Archive' },
    '7z': { icon: <File className="size-8 text-purple-500" />, label: '7Z Archive' },
    tar: { icon: <File className="size-8 text-purple-500" />, label: 'TAR Archive' },
    gz: { icon: <File className="size-8 text-purple-500" />, label: 'GZ Archive' },
  };

  return fileTypes[extension] || null;
}

interface AssetFieldWithPickerProps {
  /** The form field name (e.g., "assetId", "image") */
  name: string;
  /** Optional label for the field */
  label?: React.ReactNode;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Icon to show when no asset/URL is set (defaults to ImageIcon) */
  emptyIcon?: React.ReactNode;
  /** Dialog title for asset picker */
  dialogTitle?: string;
  /** Layout direction: 'horizontal' (default) or 'vertical' */
  layout?: 'horizontal' | 'vertical';
  /** Type of media: 'video' or 'image' (defaults to 'image') */
  type?: 'video' | 'image';
}

/**
 * Shared component for asset/image/video fields that supports both:
 * - Asset ID selection from Vendure's asset picker
 * - Direct URL input
 * - Preview for both asset IDs and URLs
 * - Video preview when type is 'video'
 */
export function AssetFieldWithPicker({
  name,
  label,
  placeholder = 'Asset ID or URL',
  emptyIcon,
  dialogTitle = 'Select Asset',
  layout = 'horizontal',
  type = 'image',
}: AssetFieldWithPickerProps) {
  const { watch, setValue } = useFormContext();
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const value = watch(name);

  // Fetch asset details when value is set (only if it's not a URL)
  const { data: assetData } = useQuery({
    queryKey: ['asset', value],
    queryFn: () => api.query(assetByIdDocument, { id: value }),
    enabled: !!value && !/^https?:\/\//i.test(value),
  });

  const asset: AssetFragment | null = assetData?.asset || null;
  const isEmptyIcon =
    emptyIcon ||
    (type === 'video' ? (
      <Video className="size-6 text-muted-foreground" />
    ) : (
      <ImageIcon className="size-6 text-muted-foreground" />
    ));
  const fileTypeInfo = getFileTypeInfo(value || '');
  const isDocumentUrl = !!fileTypeInfo;
  const isImageUrl = /^https?:\/\//i.test(value || '') && !isDocumentUrl && type === 'image';
  const isVideoUrl = /^https?:\/\//i.test(value || '') && !isDocumentUrl && type === 'video';

  // Check if asset is a video (by mime type)
  const isVideoAsset = asset && asset.mimeType?.startsWith('video/');

  // Helper to get YouTube/Vimeo embed URL
  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  };

  const videoEmbedUrl = isVideoUrl ? getVideoEmbedUrl(value) : null;

  // Determine the URL to open in new tab
  const getOpenUrl = (): string | null => {
    if (asset?.preview) return asset.preview;
    if (isDocumentUrl || isImageUrl || isVideoUrl) return value;
    return null;
  };

  const openUrl = getOpenUrl();

  // Render preview image/video/icon
  const renderPreview = () => {
    // Video asset from Vendure
    if (asset && (isVideoAsset || type === 'video')) {
      const videoUrl = asset.preview || asset.source;
      return (
        <video
          src={videoUrl}
          controls
          className={
            layout === 'vertical'
              ? 'w-full max-w-48 aspect-video rounded-md object-cover border'
              : 'w-32 aspect-video rounded-md object-cover border'
          }
        />
      );
    }

    // Image asset from Vendure
    if (asset && type === 'image') {
      return (
        <VendureImage
          asset={asset}
          preset="tiny"
          className={
            layout === 'vertical'
              ? 'w-full max-w-48 rounded-md object-cover border'
              : 'size-16 rounded-md object-cover border'
          }
        />
      );
    }

    // Document URL
    if (isDocumentUrl) {
      return (
        <div
          className={
            layout === 'vertical'
              ? 'w-full max-w-48 aspect-square rounded-md border bg-muted flex items-center justify-center'
              : 'size-16 rounded-md border bg-muted flex items-center justify-center'
          }
        >
          {fileTypeInfo.icon}
        </div>
      );
    }

    // Video URL (YouTube, Vimeo, or direct video URL)
    if (isVideoUrl) {
      if (videoEmbedUrl) {
        // YouTube or Vimeo embed
        return (
          <div
            className={
              layout === 'vertical'
                ? 'w-full max-w-48 aspect-video rounded-md border overflow-hidden'
                : 'w-32 aspect-video rounded-md border overflow-hidden'
            }
          >
            <iframe
              src={videoEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
            />
          </div>
        );
      } else {
        // Direct video URL
        return (
          <video
            src={value}
            controls
            className={
              layout === 'vertical'
                ? 'w-full max-w-48 rounded-md object-cover border'
                : 'w-32 aspect-video rounded-md object-cover border'
            }
          />
        );
      }
    }

    // Image URL
    if (isImageUrl) {
      return (
        <img
          src={value}
          alt="preview"
          className={
            layout === 'vertical'
              ? 'w-full max-w-48 rounded-md object-cover border'
              : 'size-16 rounded-md object-cover border'
          }
        />
      );
    }

    // Empty state
    return (
      <div
        className={
          layout === 'vertical'
            ? 'w-full max-w-48 aspect-square rounded-md border bg-muted flex items-center justify-center'
            : 'size-16 rounded-md border bg-muted flex items-center justify-center'
        }
      >
        {isEmptyIcon}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        layout === 'vertical' ? (
          // Vertical Layout
          <div className="p-3 border rounded-md flex flex-col items-center gap-3">
            {renderPreview()}
            <div className="w-full text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  title={
                    asset?.name ||
                    fileTypeInfo?.label ||
                    (isImageUrl || isVideoUrl ? 'External URL' : 'Loading...')
                  }
                  className="text-sm font-medium max-w-48 truncate"
                >
                  {asset?.name ||
                    fileTypeInfo?.label ||
                    (isImageUrl || isVideoUrl ? 'External URL' : 'Loading...')}
                </span>
                {openUrl && (
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => {
                      window.open(openUrl, '_blank', 'noopener,noreferrer');
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                )}
              </div>
              {!/^https?:\/\//i.test(value) && (
                <div className="text-xs max-w-48 truncate text-muted-foreground text-center mt-1 break-all">
                  ID: {value}
                </div>
              )}
              {isDocumentUrl && (
                <div className="text-xs max-w-48 truncate text-muted-foreground text-center mt-1 break-all">
                  {value}
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssetPickerOpen(true);
                }}
              >
                <Trans>Change</Trans>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue(name, '', { shouldDirty: true });
                }}
              >
                <Trans>Clear</Trans>
              </Button>
            </div>
          </div>
        ) : (
          // Horizontal Layout
          <div className="flex items-center gap-3 p-3 border rounded-md">
            {renderPreview()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  title={
                    asset?.name ||
                    fileTypeInfo?.label ||
                    (isImageUrl || isVideoUrl ? 'External URL' : 'Loading...')
                  }
                  className="text-sm max-w-72 font-medium truncate"
                >
                  {asset?.name ||
                    fileTypeInfo?.label ||
                    (isImageUrl || isVideoUrl ? 'External URL' : 'Loading...')}
                </span>
                {openUrl && (
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => {
                      window.open(openUrl, '_blank', 'noopener,noreferrer');
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                )}
              </div>
              {!/^https?:\/\//i.test(value) && (
                <div className="text-xs text-muted-foreground truncate">ID: {value}</div>
              )}
              {isDocumentUrl && <div className="text-xs text-muted-foreground truncate mt-1">{value}</div>}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssetPickerOpen(true);
                }}
              >
                <Trans>Change</Trans>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue(name, undefined, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
                }}
              >
                <Trans>Clear</Trans>
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="flex gap-2">
          <Input
            value={value || ''}
            onChange={e => {
              setValue(name, e.target.value, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAssetPickerOpen(true);
            }}
          >
            {type === 'video' ? <Video className="mr-2 h-4 w-4" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            <Trans>Pick</Trans>
          </Button>
        </div>
      )}
      <AssetPickerDialog
        open={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={assets => {
          if (assets && assets.length > 0) {
            const selectedAsset = assets[0];
            setValue(name, selectedAsset.id, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
          }
          setAssetPickerOpen(false);
        }}
        multiSelect={false}
        title={dialogTitle}
      />
    </div>
  );
}
