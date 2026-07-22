import { AbsoluteFill, Video, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export interface BRollCompositeProps {
  bRollVideoUrl: string;
  audioTrackUrl?: string;
  headlineText: string;
  brandColor?: string;
  watermarkText?: string;
}

export const BRollComposite: React.FC<BRollCompositeProps> = ({
  bRollVideoUrl,
  audioTrackUrl,
  headlineText,
  brandColor = '#6366f1',
  watermarkText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, Math.round(fps * 0.5)], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(frame, [0, Math.round(fps * 0.5)], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {bRollVideoUrl ? (
        <AbsoluteFill>
          <Video src={bRollVideoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      ) : null}

      <Sequence from={15}>
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            right: '5%',
            opacity,
            transform: `translateY(${translateY}px)`,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderLeft: `6px solid ${brandColor}`,
            padding: '16px 24px',
            borderRadius: '8px',
          }}
        >
          <h1 style={{ color: '#fff', fontSize: '36px', fontFamily: 'sans-serif', margin: 0 }}>
            {headlineText}
          </h1>
        </div>
      </Sequence>

      {watermarkText ? (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '18px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          }}
        >
          {watermarkText}
        </div>
      ) : null}

      {audioTrackUrl ? <Audio src={audioTrackUrl} volume={0.8} /> : null}
    </AbsoluteFill>
  );
};
