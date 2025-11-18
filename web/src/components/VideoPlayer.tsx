import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Session Recording</CardTitle>
      </CardHeader>
      <CardContent>
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg border"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </CardContent>
    </Card>
  );
}
