export type GeminiImageCurationPayload = {
  logoImageId: string | null;
  heroImageIds: string[];
  spaceImageIds: string[];
  galleryImageIds: string[];
  ignoredImageIds: string[];
  notes: {
    hero: string;
    space: string;
    gallery: string;
    ignored: string;
  };
};

export type GeminiImageCurationRequest = {
  salonId?: string;
  salonName: string;
  businessType?: string;
  language?: string;
  services?: string[];
  images: Array<{
    id: string;
    url: string;
    source?: string;
    caption?: string;
    score?: number;
    currentType?: string;
  }>;
};
