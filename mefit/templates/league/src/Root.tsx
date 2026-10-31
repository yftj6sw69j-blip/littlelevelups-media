import React from 'react';
import {Composition, Still} from 'remotion';
import {LeagueStory, T} from './Story';
import {LeagueCard} from './Card';
import {sample} from './data';

export const Root: React.FC = () => (
  <>
    <Composition id="LeagueStory" component={LeagueStory as any} durationInFrames={T.total} fps={30} width={1080} height={1920} defaultProps={sample} />
    <Still id="LeagueCard" component={LeagueCard as any} width={1080} height={1350} defaultProps={sample} />
  </>
);
