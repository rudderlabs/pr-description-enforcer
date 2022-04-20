const core = require('@actions/core');
const github = require('@actions/github');

const PR_TEMPLATE_PATHS = [
  '.github/pull_request_template.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  'PULL_REQUEST_TEMPLATE.md',
  'pull_request_template.md',
  'docs/PULL_REQUEST_TEMPLATE.md',
  'docs/pull_request_template.md',
  'PULL_REQUEST_TEMPLATE.txt',
  'pull_request_template.txt',
  '.github/PULL_REQUEST_TEMPLATE.txt',
  '.github/pull_request_template.txt',
  'docs/PULL_REQUEST_TEMPLATE.txt',
  'docs/pull_request_template.txt',
  'PULL_REQUEST_TEMPLATE',
  'pull_request_template',
  '.github/PULL_REQUEST_TEMPLATE',
  '.github/pull_request_template',
  'docs/PULL_REQUEST_TEMPLATE',
  'docs/pull_request_template',
]

const getPrNumber = () => {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }
  return pullRequest.number;
}

const getPrDescription = async (client) => {
  const prNumber = getPrNumber();
  if (!prNumber) {
    core.error("Could not get pull request number from context, exiting");
    return;
  }
  const { data: pullRequest } = await client.pulls.get({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });

  // github adds \r\n on pr body
  return pullRequest.body.replace(/(\r\n)/g, '\n')
}

const getPrTemplate = async (client, paths) => {
  const prTemplatePath = paths.shift();

  core.info(`trying pr template path: ${prTemplatePath}`);

  try {
    const {data: content} = await client.repos.getContent({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      path: prTemplatePath,
      mediaType: {
        format: 'raw',
      } 
    });

    return content;
  } catch (error) {
    if (!paths.length) {
      return undefined
    }
    core.warning(`error getting pr template (${prTemplatePath}): ${error.message}`)
    return getPrTemplate(client, paths)
  }
}

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });
    const placeholderRegex = new RegExp(core.getInput("placeholder-regex", {required: false}) || "< Replace .* >");

    const client = github.getOctokit(token)

    const prDescription = await getPrDescription(client)
    const prTemplate = await getPrTemplate(client, PR_TEMPLATE_PATHS)

    if (!prDescription) {
      core.setFailed("Pull request description is missing");
      return
    }
    if (prDescription.includes(prTemplate)) {
      core.setFailed("Pull request description is the same with the template's text verbatim. Please adjust the default text to include a more complete description");
      return
    }
    if (prDescription.match(placeholderRegex)) {
      core.setFailed("Pull request template placeholders found. Please replace the placeholders with the appropriate text");
      return
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
