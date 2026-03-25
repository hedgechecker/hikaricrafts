import { useEffect, useState } from 'react';
import styles from './styles/Sidebar.module.css';
import type { ThreeEditor } from '../core/ThreeEditor';
import ToolButton from '../../global/ToolButton';
import { useDialog } from '../../global/useDialog';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../core/EditorStore';

const BASE_URL = import.meta.env.VITE_API_URL;

interface Project {
  id: number;
  name: string;
  isPublic: boolean;
}

interface Props {
  engine: ThreeEditor;
}

/**
 * SideBar component
 *
 * Displays the list of user projects and allows:
 * - creating a new project
 * - loading existing projects
 * - renaming projects
 * - deleting projects
 *
 * Integrates with Editor for loading/opening projects
 * and communicates with the backend API for project persistence.
 */
export default function SideBar({ engine }: Props) {
  //UI State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));

  // project data
  const [projects, setProjects] = useState<Project[]>([]);
  const { project } = useEditorStore(engine.getStore());
  const selectedProject = project? (project.id? project.id : -1) : null;

  const { showDialog, dialogComponent } = useDialog();
  const navigate = useNavigate();

  // Load projects from API once when the sidebar mounts
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [project]);

  // Close dropdown menus and inline editing when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null);
      setEditingId(null);
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fetch all projects available to the current user (private + public)
  async function loadProjects() {
    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/wireArtProjects`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return;

    const data = await res.json();
    setProjects(data);
  }

  // Prevent losing unsaved work before switching projects
  async function handleProjectClick(id: number) {
    if(!engine)return;
    if (engine.hasChanges) {
      const result = await showDialog({
        type: 'confirm',
        message: 'Das Projekt hat ungespeicherte Änderungen, wollen sie diese Verwerfen?',
      });
      if (!result) {
        return;
      }
    }
    engine.loadGlobal(id);
  }

  // Rename a project via API and refresh the project list
  async function submitRename(project: Project) {
    if (!editingName.trim()) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/wireArtProjects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name: editingName }),
    });

    if (res.ok) {
      await loadProjects();
    }

    setEditingId(null);
    setOpenMenuId(null);
  }

  // Delete a project after user confirmation
  async function handleDelete(project: Project) {
    const result = await showDialog({
      type: 'confirm',
      message: 'Wollen Sie sicher dieses Projekt unwiderruflich löschen?',
    });
    if (!result) {
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/wireArtProjects/${project.id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok) {
      loadProjects();
    }

    setEditingId(null);
    setOpenMenuId(null);
    engine.load(null);
  }

  // Open a new project after user confirmation
  const handleNewProject = async () => {
    if (!engine) return;
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (!token) {
      const result = await showDialog({
        type: 'confirm',
        message:
          'Sie sind nicht angemeldet, alle aktuellen Änderungen werden verworfen, sicher neues Projekt erstellen? ',
      });
      if (!result) {
        return;
      }
    } else if (engine.hasChanges) {
      const result = await showDialog({
        type: 'confirm',
        message: 'Das Projekt hat ungespeicherte Änderungen, wollen sie diese Verwerfen?',
      });
      if (!result) {
        return;
      }
    }
    //Load empty Project
    engine.load(null);
  };

  return (
    <div className={styles.wrapper} id='sidebar'>
      {dialogComponent}
      <div
        key={-1}
        className={`${styles.projectItem} ${-1 === selectedProject ? styles.selected : ''}`}
        onClick={handleNewProject}
      >
        {' '}
        <span className={styles.projectName}>{'Neues Projekt erstellen'}</span>
        <div className={styles.menuWrapper}> <img src="/icons/add.png" style={{ height: '28px', width: '28px' }}></img> </div>
      </div>

      {isLoggedIn && <h3>Deine Projekte</h3>}
      {!isLoggedIn && <ToolButton label="Anmelden" onClick={() => navigate('/login')}></ToolButton>}
      {/* Project list */}
      {projects
        .filter((p) => !p.isPublic)
        .map((project) => (
          <div
            key={project.id}
            className={`${styles.projectItem} ${project.id === selectedProject ? styles.selected : ''}`}
            onClick={() => {
              if (!editingId) handleProjectClick(project.id);
            }}
          >
            {/* PROJECT NAME OR INLINE INPUT */}
            {editingId === project.id ? (
              <input
                autoFocus
                className={styles.renameInput}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(project);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={() => submitRename(project)}
              />
            ) : (
              <span className={styles.projectName}>{project.name || 'Unbenanntes Projekt'}</span>
            )}

            {/* MENU */}
            <div className={styles.menuWrapper} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.menuButton}
                onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
              >
                ⋯
              </button>

              <div className={`${styles.dropdown} ${openMenuId === project.id ? styles.show : ''}`}>
                <div
                  className={styles.dropdownItem}
                  onClick={() => {
                    setEditingId(project.id);
                    setEditingName(project.name);
                    setOpenMenuId(null);
                  }}
                >
                  Umbenennen
                </div>

                <div
                  className={`${styles.dropdownItem} ${styles.delete}`}
                  onClick={() => handleDelete(project)}
                >
                  Löschen
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
