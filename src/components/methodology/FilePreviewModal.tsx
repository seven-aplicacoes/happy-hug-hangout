import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getFileUrl } from "@/utils/fileUtils";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileTitle: string;
  filePath?: string;
  fileUrl?: string;
  fileType?: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileTitle,
  filePath,
  fileUrl,
  fileType,
}: FilePreviewModalProps) {
  const [safeUrl, setSafeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open && (filePath || fileUrl)) {
      loadSafeUrl();
    } else {
      setSafeUrl(null);
      setError(false);
    }
  }, [open, filePath, fileUrl]);

  const loadSafeUrl = async () => {
    setLoading(true);
    setError(false);
    try {
      if (filePath) {
        const url = await getFileUrl(filePath);
        setSafeUrl(url);
      } else {
        setSafeUrl(fileUrl || null);
      }
    } catch (err) {
      console.error("Error loading safe URL:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const isPdf = fileType?.includes("pdf") || fileUrl?.toLowerCase().endsWith(".pdf") || filePath?.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate pr-4">{fileTitle}</DialogTitle>
          <div className="flex items-center gap-2 pr-8">
            {safeUrl && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={safeUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir original
                  </a>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-2" />
              <p className="font-medium">Não foi possível visualizar o arquivo.</p>
              <p className="text-sm text-muted-foreground mb-4">Tente baixar ou abrir em outro navegador.</p>
              {safeUrl && (
                <Button asChild>
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir original</a>
                </Button>
              )}
            </div>
          ) : safeUrl ? (
            isPdf ? (
              <iframe
                src={`${safeUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title={fileTitle}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <p className="mb-4">Este tipo de arquivo não suporta pré-visualização direta.</p>
                <Button asChild>
                  <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir original</a>
                </Button>
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
