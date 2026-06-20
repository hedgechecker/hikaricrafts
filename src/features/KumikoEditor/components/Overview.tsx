import { Link, useNavigate } from "react-router-dom";
import NavBar from "../../global/NavBar";
import styles from "./styles/Overview.module.css";

export default function Overview() {
  const navigate = useNavigate();

  const projects = [
    {
      id: 1,
      title: "Ananas",
      images: [
        "/projects/pineapple/final.jpeg",
        "/projects/pineapple/final.jpeg",
      ],
      link: "/kumikoeditor/1",
    },
  ];

  return (
    <div className={styles.page}>
      <NavBar selected={"wallArt"} />

      <main className={styles.container} role="main">
        <h2 className={styles.title}>Geometrische Wandkunst Projekte</h2>

        <div className={styles.buttoncontainer}>
          <Link to="/kumikoeditor?tutorial">
            <button
              className={styles.button}
              onClick={() => navigate("/kumikoeditor")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#ffffff"
              >
                <path d="M300-80q-58 0-99-41t-41-99v-520q0-58 41-99t99-41h500v600q-25 0-42.5 17.5T740-220q0 25 17.5 42.5T800-160v80H300Zm-60-267q14-7 29-10t31-3h20v-440h-20q-25 0-42.5 17.5T240-740v393Zm160-13h320v-440H400v440Zm-160 13v-453 453Zm60 187h373q-6-14-9.5-28.5T660-220q0-16 3-31t10-29H300q-26 0-43 17.5T240-220q0 26 17 43t43 17Z" />
              </svg>
              Tutorial ansehen{" "}
            </button>
          </Link>
          <Link to="/kumikoeditor">
            <button
              className={styles.button}
              onClick={() => navigate("/kumikoeditor")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#ffffff"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
              </svg>
              Zum Editor{" "}
            </button>
          </Link>
        </div>  

        <div className={styles.grid}>
          {projects.map((project) => (
            <div key={project.id} className={styles.card}>
              <h3 className={styles.title}>{project.title}</h3>
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

              {/* <Link to={project.link}>
                <button className={styles.button}>Im Editor öffnen</button>
              </Link> */}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
