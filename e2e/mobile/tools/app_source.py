"""Where the app's source is — for the tools that read it (check_literals.py, source_coverage.py, sweep_strings.py).

  inside MentorTwo (once e2e/ has moved in)   that repo, at HEAD — in CI, exactly the commit being deployed
  anywhere else (today: the fetch repo)       $MENTORTWO_REPO, else ~/GitHub/MentorAPM/MentorTwo, at
                                              origin/development — what dev is built from (fetch it first)

Each tool still takes --repo and --ref to override either.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SIBLING = os.path.expanduser("~/GitHub/MentorAPM/MentorTwo")


def toplevel(path):
    """The git work tree `path` is in, or None. (A CI checkout or a worktree has a `.git` FILE, not a folder.)"""
    r = subprocess.run(["git", "-C", path, "rev-parse", "--show-toplevel"], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def default_repo_and_ref():
    top = toplevel(HERE)
    if top and os.path.isdir(os.path.join(top, "client", "mobile")):
        return top, "HEAD"
    return os.environ.get("MENTORTWO_REPO", SIBLING), "origin/development"


DEFAULT_REPO, DEFAULT_REF = default_repo_and_ref()


def require_repo(repo):
    if not toplevel(repo):
        sys.exit(f"not a git repo: {repo}  (set MENTORTWO_REPO, or pass --repo)")
