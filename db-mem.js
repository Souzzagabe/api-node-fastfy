import { randomUUID } from 'crypto';

export class Database {
    #todos = new Map();

    list(search) {
        return Array.from(this.#todos.entries())
            .map(([id, data]) => ({
                id,
                ...data
            }))
            .filter(todo => !search || todo.title.includes(search));
    }

    create(todo) {
        const todoId = randomUUID();
        this.#todos.set(todoId, todo);
        return todoId;
    }

    update(id, todo) {
        if (this.#todos.has(id)) {
            this.#todos.set(id, todo);
            return true;
        }
        return false;
    }

    delete(id) {
        this.#todos.delete(id);
    }
}