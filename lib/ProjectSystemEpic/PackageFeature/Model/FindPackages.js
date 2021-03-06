"use babel";
// @flow

import type {
  Directory as PackageDirectory,
  Package,
  Plugin,
} from "../Types/types";
import os from "os";
import { List } from "immutable";
import path from "path";
import Rx from "rxjs";
import type { PackageTesterResult } from "../Types/types";

export function isPackageOfPlugin(
  packagePath: string,
  plugin: Plugin,
  directory: PackageDirectory,
): PackageTesterResult {
  if (typeof plugin.isPackage === "string") {
    return plugin.isPackage === path.basename(packagePath);
  } else if (plugin.isPackage instanceof RegExp) {
    return packagePath.match(plugin.isPackage) != null;
  } else if (typeof plugin.isPackage === "function") {
    return plugin.isPackage(packagePath, directory);
  } else {
    return false;
  }
}

function getUriPlatform() {
  return os.platform() == "win32" ? "windows" : "posix";
}

export function getPackageOfPlugin(
  packagePath: string,
  plugin: Plugin,
  isFile: boolean,
): Package {
  return {
    name: path.basename(path.dirname(packagePath)),
    path: packagePath,
    plugin: plugin,
    type: isFile ? "file" : "directory",
    uriPlatform: getUriPlatform(),
  };
}

function getPackagesOfEntry(
  plugins: Array<Plugin>,
  entry,
  entries: Array<atom$File | atom$Directory>,
) {
  return Rx.Observable.from(plugins)
    .map(plugin =>
      Rx.Observable.defer(() => {
        let entryPath = entry.getPath();
        let isPackage = isPackageOfPlugin(entryPath, plugin, {
          name: entryPath,
          files: entries.map(e => e.getPath()),
        });
        if (!(isPackage instanceof Promise)) {
          isPackage = Promise.resolve(isPackage);
        }
        return Rx.Observable.fromPromise(isPackage).map(test => {
          if (typeof test === "boolean") {
            if (test) {
              return getPackageOfPlugin(entryPath, plugin, entry.isFile());
            } else {
              return false;
            }
          } else {
            return Object.assign({}, test, { plugin: plugin });
          }
        });
      }),
    )
    .mergeAll(5);
}

export function findPackages(
  rootPath: string,
  plugins: Array<Plugin>,
): Rx.Observable<Array<Package>> {
  const { Directory, File } = require("atom");

  if (
    !Directory ||
    !File ||
    path.basename(rootPath) === "node_modules" ||
    path.basename(rootPath) === ".git"
  )
    return Rx.Observable.of([]);
  if (!rootPath.match(/(.)*\.(.)*/gi)) {
    const directory = new Directory(rootPath);
    const getEntries = Rx.Observable.bindNodeCallback(
      directory.getEntries.bind(directory),
    );
    const entriesObs = getEntries();

    return entriesObs
      .map(entries => {
        return Rx.Observable.defer(() => {
          if (entries == null) return Rx.Observable.empty();
          else
            return Rx.Observable.concat(
              ...entries.map(entry =>
                Rx.Observable.defer(() =>
                  getPackagesOfEntry(plugins, entry, entries || [])
                    .filter(v => v !== false)
                    .concat(
                      entry.isDirectory()
                        ? findPackages(entry.getPath(), plugins)
                        : Rx.Observable.empty(),
                    )
                    .reduce((acc, v) => acc.concat(v), [])
                    .delay(1),
                ),
              ),
            );
        });
      })
      .mergeAll(1)
      .reduce((acc, v) => acc.concat(v), List())
      .map(v => v.toArray());
  } else {
    return Rx.Observable.defer(() =>
      getPackagesOfEntry(plugins, new File(rootPath), [])
        .filter(v => v !== false)
        .map(v => ({ ...v, isFile: true }))
        .reduce((acc, v) => acc.concat(v), []),
    );
  }
}
