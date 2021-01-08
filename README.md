# Master Thesis Code

This repository contains the source code for the master thesis: *Detection of historical spelling variations using cluster analysis and string similarity*.

## Jupyter Setup

The Jupyter Notebooks provide an overview of the experiments and preprocessing.

```
python3 -m venv
source .venv/bin/activate

# (optional) pip update, if errors occur during installation
pip3 install -U pip

pip3 install -r requirements.txt
jupyter labextension install jupyterlab-plotly

jupyter lab
```

**Hint:** Some Jupyter graphics require Node.js

## Stacked Tree Setup

The Stacked Tree Visualisation is an interactive tool to explore the cluster analysis.

```
# Requires a local webserver to load the HTML/Javascript.
# Examples:

python3 -m http.server
php -S localhost:8000
docker run -ti --rm -v $(pwd):/usr/share/nginx/html -p 8000:80 nginx:stable
```
