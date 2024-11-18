# metaplane cli

This CLI provides miscellaneous tools for working with data stacks.

## Installation

Download the latest binary appropriate for your platform from the [releases page](https://github.com/metaplane/cli/releases) then optionally add it to your PATH for easy access.

```sh
LOCAL_BIN=$HOME/.local/bin
mkdir -p $LOCAL_BIN
curl -LSs https://github.com/metaplane/cli/releases/download/0.1.0/mp-macos-arm64 -o $LOCAL_BIN/metaplane
chmod +x $LOCAL_BIN/metaplane
PATH=$LOCAL_BIN:$PATH # add this to your shell profile
```

Alternatively, you can run the binary directly from wherever you stored it after downloading it.

```sh
./path/to/mp-macos-arm64
```

## dbt

Generate a UI from the latest dbt run

```sh
metaplane dbt ui build
```

This command will provide a `.metaplane` directory in the current working directory containing an `index.html` file that you can open in your browser.

If you're invoking the CLI from outside of your dbt project's root or if your dbt project is configured with a custom `target-path`, you can run the command with the `--target-path` flag to specify the path to the dbt run results.

```sh
metaplane dbt ui build --target-path /path/to/dbt/target
```
