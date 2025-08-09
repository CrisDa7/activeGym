from setuptools import setup, find_packages

setup(
    name="activegym",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "Flask-CORS==4.0.0",
        "psycopg2-binary==2.9.9",
        "gunicorn==21.2.0",
        "Werkzeug==2.3.7",
    ],
    python_requires=">=3.11",
)
