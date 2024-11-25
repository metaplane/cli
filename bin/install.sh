#!/bin/bash

set -u

abort() {
  printf "%s\n" "$@" >&2
  exit 1
}

OS="$(uname)"

UNAME_MACHINE="$(uname -m)"
if [[ "${OS}" == "Darwin" ]]
then
  if [[ "${UNAME_MACHINE}" == "arm64" ]]
  then
    DOWNLOAD_URL="https://cli.metaplane.dev/spm/download/macos-arm64/metaplane"
  else
    echo "Unsupported architecture for macOS: ${UNAME_MACHINE}"
    exit 1
  fi
elif [[ "${UNAME_MACHINE}" == "x86_64" ]]
then
  DOWNLOAD_URL="https://cli.metaplane.dev/spm/download/linux-x86_64/metaplane"
elif [[ "${UNAME_MACHINE}" == "aarch64" ]] || [[ "${UNAME_MACHINE}" == "arm64" ]]
then
  DOWNLOAD_URL="https://cli.metaplane.dev/spm/download/linux-aarch64/metaplane"
else
  echo "Unsupported architecture: ${UNAME_MACHINE}"
  exit 1
fi

LOCAL_BIN=$HOME/.local/bin
mkdir -p $LOCAL_BIN

echo "Downloading the Metaplane CLI binary for ${OS} ${UNAME_MACHINE} to ${LOCAL_BIN}..."

curl -LSs $DOWNLOAD_URL -o $LOCAL_BIN/metaplane

if [ $? -ne 0 ]; then
  abort "Failed to download the Metaplane CLI binary"
fi

chmod +x $LOCAL_BIN/metaplane

if ! command -v metaplane >/dev/null 2>&1; then
  echo "Adding ${LOCAL_BIN} to the PATH"
  export PATH=$LOCAL_BIN:$PATH
fi

echo "The Metaplane CLI has been stored in ${LOCAL_BIN}/metaplane and added to the PATH"
