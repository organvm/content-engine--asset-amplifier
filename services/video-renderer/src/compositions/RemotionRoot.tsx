import { Composition, registerRoot } from 'remotion';
import { BRollComposite } from './BRollComposite.js';

export const RemotionRoot: React.FC = () => {
  const defaultProps: Record<string, unknown> = {
    bRollVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    headlineText: 'Generative B-Roll Composite',
    brandColor: '#6366f1',
    watermarkText: 'CRONUS',
  };

  return (
    <>
      <Composition
        id="BRollComposite"
        component={BRollComposite as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};

registerRoot(RemotionRoot);
