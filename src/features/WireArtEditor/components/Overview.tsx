import { Link } from "react-router-dom";
import NavBar from "../../global/NavBar";
import styles from "./styles/Overview.module.css";

export default function Overview() {
  const projects = [
    {
      id: 1,
      title: "Ananas",
      images: [
        "/projects/pineapple/raw.png",
        "/projects/pineapple/overlay.png",
        "/projects/pineapple/lines.png",
        "/projects/pineapple/finished",
      ],
      link: "/editor/1",
    },
    {
      id: 2,
      title: "Farbexplosion",
      description: "Buntes Design mit dynamischen Farbverläufen.",
      link: "/editor/2",
    },
    {
      id: 3,
      title: "Typografie Poster",
      description: "Modernes Poster mit anpassbarem Text.",
      link: "/editor/3",
    },
  ];

  return (
    <div className={styles.page}>
      <NavBar selected={"wallArt"} />

      <div className={styles.container}>
        <h2 className={styles.title}>Geometrische Wandkunst Projekte</h2>

        <Link to="/wirearteditor">
          <p>Tutorial ansehen</p>
        </Link>
        <Link to="/wirearteditor">
          <p>Zum Editor</p>
        </Link>

        <div className={styles.grid}>
          {projects.map((project) => (
            <div key={project.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{project.title}</h3>
              <div className={styles.imagecontainer}>
                {project.images?.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={project.title}
                    className={styles.image}
                  />
                ))}
              </div>
             
                <a href="https://pixabay.com/users/pexels-2286921/?utm_source=link-attribution&utm_medium=referral&utm_campaign=image&utm_content=1850823">
                  Image byPexels
                </a>
            

              <Link to={project.link}>
                <button className={styles.button}>Im Editor öffnen</button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
