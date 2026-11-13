"""Scraper des résultats FDJ (EuroMillions, Loto, EuroDreams).

Les pages résultats de fdj.fr sont rendues côté serveur (Next.js) et embarquent
les données structurées des tirages dans le flux RSC (`self.__next_f`).
On lit ce JSON directement : pas de navigateur, pas de sélecteurs CSS fragiles.
Les tirages sont enregistrés dans MongoDB (collection `draws`).
"""

from .games import GAMES
from .repository import DrawRepository
from .scraper import Report, Scraper

__all__ = ["GAMES", "DrawRepository", "Report", "Scraper"]
