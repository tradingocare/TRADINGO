SELECT ct.name as template, COUNT(tf.id) as field_count
FROM "CategoryTemplate" ct
LEFT JOIN "TemplateSection" ts ON ts."templateId" = ct.id
LEFT JOIN "TemplateField" tf ON tf."sectionId" = ts.id
GROUP BY ct.id, ct.name
ORDER BY ct.name;
