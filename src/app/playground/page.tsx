import { PlaygroundClient } from "@/app/playground/PlaygroundClient";

type PlaygroundPageProps = {
  searchParams: Promise<{
    shape?: string | string[];
  }>;
};

export default async function Playground({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;
  const selectedShape = Array.isArray(params.shape) ? params.shape[0] : params.shape;

  return <PlaygroundClient selectedShape={selectedShape} />;
}
