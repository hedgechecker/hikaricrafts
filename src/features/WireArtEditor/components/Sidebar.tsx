import { useEffect, useState } from 'react';
import styles from './styles/SideBar.module.css';
import type { EditorEngine } from '../core/EditorEngine';
import ToolButton from './ToolButton';

const BASE_URL = import.meta.env.VITE_API_URL;

interface Project {
  id: number;
  name: string;
  isPublic: boolean;
}

interface Props {
  engine: EditorEngine;
}

export default function SideBar({ engine }: Props) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setselectedProject] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null);
      setEditingId(null);
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function loadProjects() {
    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/wireArtProjects`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return;

    const data = await res.json();
    setProjects(data);
  }

  function handleClick(id: number) {
    setselectedProject(id);
    engine.loadGlobal(id);
  }

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

  async function handleDelete(project: Project) {
    if (!confirm(`Projekt "${project.name}" wirklich löschen?`)) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/wireArtProjects/${project.id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok) {
      loadProjects();
    }

    setOpenMenuId(null);
  }

  return (
    <div className={styles.wrapper}>
      <ToolButton
        label="Neues Projekt erstellen"
        image="/icons/add.png"
        onClick={() => {
          engine.openNewProjekt();
        }}
      ></ToolButton>
      <h3>Eigene Projekte</h3>
      {projects
        .filter((p) => !p.isPublic)
        .map((project) => (
          <div
            key={project.id}
            className={`${styles.projectItem} ${project.id === selectedProject ? styles.selected : ''}`}
            onClick={() => {
              if (!editingId) handleClick(project.id);
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
