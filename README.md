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

### CI/CD usage

While it's useful to visualize runs that were executed locally, it's often more useful to visualize runs that were executed in a CI/CD pipeline.

The exact steps will vary depending on your CI/CD provider, but the following is an example of how you might generate the UI report in a GitHub Actions workflow.

```yaml
- name: run dbt
  run: dbt run

- name: install metaplane cli
  run: |
    LOCAL_BIN=$HOME/.local/bin
    mkdir -p $LOCAL_BIN
    curl -LSs https://github.com/metaplane/cli/releases/download/0.1.0/mp-linux-x86_64 -o $HOME/.local/bin/metaplane
    chmod +x $HOME/.local/bin/metaplane
    PATH=$HOME/.local/bin:$PATH

- name: generate dbt results ui
  run: metaplane dbt ui build

- uses: actions/upload-artifact@v4
  with:
    name: metaplane-dbt-report
    path: .metaplane/index.html
```

The `actions/upload-artifact` action is used to upload and associated the generated UI as an artifact to the workflow run. This allows you to download the after the workflow has completed.

## Disclaimer

The code in this repository is not currently buildable as it has dependencies on private packages. Maintainers will keep the code here up-to-date with the latest changes from the main, internal, repo.
