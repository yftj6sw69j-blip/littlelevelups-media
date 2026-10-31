import React from 'react';
import {Composition, Still} from 'remotion';
import {LeagueStory, T} from './Story';
import {LeagueCard} from './Card';
import {LadderStory, LadderCard, ladderSample, stepsSample} from './Ladder';
import {sample} from './data';

export const Root: React.FC = () => (
  <>
    {/* Ranked leaderboard: November Grind */}
    <Composition id="LeagueStory" component={LeagueStory as any} durationInFrames={T.total} fps={30} width={1080} height={1920} defaultProps={sample} />
    <Still id="LeagueCard" component={LeagueCard as any} width={1080} height={1350} defaultProps={sample} />
    {/* Badge mountain: 12 Days of Strong, Step Up, Christmas Keep-Going, Festive Steps */}
    <Composition id="LadderStory" component={LadderStory as any} durationInFrames={330} fps={30} width={1080} height={1920} defaultProps={ladderSample} />
    <Still id="LadderCard" component={LadderCard as any} width={1080} height={1350} defaultProps={ladderSample} />
    <Composition id="StepsStory" component={LadderStory as any} durationInFrames={330} fps={30} width={1080} height={1920} defaultProps={stepsSample} />
    <Still id="StepsCard" component={LadderCard as any} width={1080} height={1350} defaultProps={stepsSample} />
  </>
);
