'use babel'
// @flow

import React from 'react';
import PaneDock from "./PaneDock";
import VersionningDockIcon from "../../VersionningEpic/CommitFeature/Presenters/VersionningDockIcon";

export default class RightPaneDock extends React.Component<DefaultProps, Props, State> {

  state: State;
  props: Props;
  static defaultProps: DefaultProps;

  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <PaneDock>
        <VersionningDockIcon onClick={() => this.props.onVersionning()}/>
      </PaneDock>
    )
  }
}

RightPaneDock.propTypes = {

};

RightPaneDock.defaultProps = {

};

type DefaultProps = {

};

type Props = {
  onVersionning(): void,
};

type State = {

};