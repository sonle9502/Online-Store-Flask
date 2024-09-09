class GenStringSQL:
    queries = {
        'all_data': """
                    SELECT 
                    t.id AS id,
                    t.content AS content,
                    t.completed AS completed,
                    t.unitPrice AS unitPrice,
                    t.description AS description,
                    t.quantity_title AS quantity_title,
                    DATE_FORMAT(t.due_date, '%Y年%m月%d日 %H時%i分') AS due_date,
                    t.email_sent AS email_sent,
                    DATE_FORMAT(t.created_at, '%Y年%m月%d日 %H時%i分') AS created_at,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', i.id, 
                            'filename', i.filename
                        )
                    ) AS images,
                    COALESCE(
                        (
                            SELECT JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', c.id, 
                                    'content', c.content,
                                    'created_at', c.created_at
                                )
                            )
                            FROM comment c
                            WHERE c.todo_id = t.id
                            ORDER BY c.id DESC
                        ),
                        JSON_ARRAY()
                    ) AS comments
                    FROM 
                        todo t
                    LEFT JOIN (
                        SELECT DISTINCT id, filename, todo_id
                        FROM image
                    ) i ON t.id = i.todo_id
                    GROUP BY 
                        t.id
                    ORDER BY 
                        t.created_at DESC;
                    """,

        'only_task': """
                   SELECT
                    t.id,
                    t.content,
                    t.completed,
                    t.description,
                    t.due_date,
                    t.email_sent,
                    COALESCE(
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', i.id,
                                'filename', i.filename,
                                'data', i.data
                            )
                        ), '[]'
                    ) AS images,
                    COALESCE(
                        (
                            SELECT
                                JSON_ARRAYAGG(
                                    JSON_OBJECT(
                                        'id', c.id,
                                        'content', c.content,
                                        'created_at', c.created_at
                                    )
                                )
                            FROM
                                comment c
                            WHERE
                                c.todo_id = t.id
                            ORDER BY
                                c.created_at DESC
                        ), '[]'
                    ) AS comments
                    FROM
                        todo t
                    LEFT JOIN
                        image i ON t.id = i.todo_id
                    WHERE
                        t.id = %s
                    GROUP BY
                        t.id;
                    """
    }
    
    @classmethod
    def sqlstring(cls, target):
        try:
            return cls.queries[target]
        except KeyError:
            raise ValueError(f"Unknown target: {target}")
