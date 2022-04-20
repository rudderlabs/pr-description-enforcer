# Pull Request Description Enforcer

github action for enforcing description on pull requests, it will reject empty descriptions or unedited pull request template descriptions.

## Usage

### Create Workflow

Create a workflow (eg: `.github/workflows/pr-description-enforcer.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize the action with content:

```
# This workflow will enforce description on pull requests.

name: 'PR Description Enforcer'
on:
    pull_request:
        types: [opened, edited, reopened]

jobs:
    enforce:
        runs-on: ubuntu-latest

        steps:
            - uses: rudderlabs/pr-description-enforcer@v1.0.0
              with:
                  repo-token: '${{ secrets.GITHUB_TOKEN }}'
                  placeholder-regex: '< Replace .* >'

```

_Note: This grants access to the `GITHUB_TOKEN` so the action can make calls to GitHub's rest API_
