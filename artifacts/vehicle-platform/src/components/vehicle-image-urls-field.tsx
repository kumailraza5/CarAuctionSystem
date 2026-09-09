import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { uploadVehicleImages } from "@/lib/upload-vehicle-images";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function VehicleImageUrlsField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const appendUrls = (urls: string[]) => {
    const existing = value.split(",").map((s) => s.trim()).filter(Boolean);
    onChange([...existing, ...urls].join(", "));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (!token) {
      toast({ variant: "destructive", title: "Sign in required", description: "Log in to upload images." });
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadVehicleImages(Array.from(files), token);
      appendUrls(urls);
      toast({ title: "Images uploaded", description: `${urls.length} image(s) added to the list.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload images.",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
          className="font-mono bg-secondary/50 min-w-0 flex-1"
          placeholder="https://..., https://... or use Upload"
        />
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={onFileChange}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 font-mono uppercase text-xs tracking-wider"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
        Paste image URLs (comma-separated) or upload files (JPEG, PNG, GIF, WebP — up to 8MB each). Uploaded files are stored on the API server.
      </p>
    </div>
  );
}
