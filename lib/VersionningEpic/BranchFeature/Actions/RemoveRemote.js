'use babel'
// @flow

import type {PackageInfos} from '../../../ProjectSystemEpic/PackageFeature/Types/types.js.flow';
import path from 'path';
import {exec} from 'child_process';
import {refreshRemotes} from './RefreshRemotes';

export type RemoveRemoteAction = (dispatch: (action: any) => void) => void;

export function remoteRemote(remote: string, packageInfos: PackageInfos): RemoveRemoteAction {
  return dispatch => {
    let child = exec(
      `git remote remove ${remove}`,
      {cwd: path.dirname(packageInfos.path)},
      (err, stdout, stderr) => {
        if (err) {
          atom.notifications.addError(`Impossible to remove remote ${remote}`, {
            detail: stderr + '\n' + err.toString()
          });
        } else {
          atom.notifications.addSuccess(`Removed remote ${remote}`, {
            detail: stdout
          });
          dispatch(refreshRemotes(packageInfos));
        }
      }
    );
  };
};