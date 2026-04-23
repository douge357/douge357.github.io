# Minimal Mistakes on GitHub Pages

This project is set up to use the `mmistakes/minimal-mistakes` theme through `remote_theme`, which is the GitHub Pages-friendly installation method documented by Minimal Mistakes.

## Before you push

Update these fields in `_config.yml` if you want to personalize the site further:

- `title`
- `name`
- `description`
- `description`
- `author.bio`
- `author.location`

## Recommended repo setup

### User site

If you want the site at `https://douge357.github.io`, create a repository named:

`douge357.github.io`

Then keep:

- `url: "https://YOUR_GITHUB_USERNAME.github.io"`
- `url: "https://douge357.github.io"`
- `baseurl: ""`

### Project site

If you want the site at `https://YOUR_GITHUB_USERNAME.github.io/PROJECT_NAME`, use a normal repository name and set:

- `url: "https://YOUR_GITHUB_USERNAME.github.io"`
- `baseurl: "/PROJECT_NAME"`
- `repository: "YOUR_GITHUB_USERNAME/PROJECT_NAME"`

## Local preview

1. Install Ruby and Bundler.
2. Run `bundle install`
3. Run `bundle exec jekyll serve`
4. Open `http://127.0.0.1:4000`

## Deploy to GitHub Pages

1. Commit these files.
2. Push to GitHub.
3. In GitHub, open `Settings -> Pages`.
4. Choose the branch you want GitHub Pages to publish from if prompted.
5. Wait for the Pages build to complete.

## Notes

- `jekyll-include-cache` must stay in both `Gemfile` and `_config.yml`.
- The current remote theme reference is `mmistakes/minimal-mistakes@4.28.0`.
- Add pages under `_pages/` and posts under `_posts/`.
