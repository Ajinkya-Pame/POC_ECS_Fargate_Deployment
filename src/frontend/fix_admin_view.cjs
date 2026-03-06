const fs = require('fs');

try {
    const file = 'd:\\Cricket\\Cricket\\client\\src\\pages\\AdminView.jsx';
    let code = fs.readFileSync(file, 'utf8');

    // 1. Add useParams
    if (!code.includes('useParams')) {
        code = code.replace(
            `import React, { useState, useEffect } from 'react';`,
            `import React, { useState, useEffect } from 'react';\nimport { useParams } from 'react-router-dom';`
        );
    }

    if (!code.includes('const { matchId } = useParams();')) {
        code = code.replace(
            `export default function AdminView() {`,
            `export default function AdminView() {\n  const { matchId } = useParams();`
        );
    }

    // 2. Replace 'current' equality
    code = code.replace(/\.eq\('id', 'current'\)/g, `.eq('match_id', matchId)`);

    // 3. Subscriptions
    code = code.replace(
        `table: 'commentary' }, payload => {`,
        `table: 'commentary', filter: \`match_id=eq.\${matchId}\` }, payload => {`
    );
    code = code.replace(
        `table: 'match_state' }, payload => {`,
        `table: 'match_state', filter: \`match_id=eq.\${matchId}\` }, payload => {`
    );
    code = code.replace(
        `if (payload.new.id === 'current') {`,
        `if (payload.new.match_id === matchId) {`
    );

    // 4. Selections
    code = code.replace(
        /await supabase\.from\('commentary'\)\.select\('\*'\)\.order/g,
        `await supabase.from('commentary').select('*').eq('match_id', matchId).order`
    );
    code = code.replace(
        /await supabase\.from\('roster'\)\.select\('\*'\);/g,
        `await supabase.from('roster').select('*').eq('match_id', matchId);`
    );

    // 5. Appending match_id to existing update/select conditions
    code = code.replace(/\.eq\('player_name',/g, `.eq('match_id', matchId).eq('player_name',`);
    code = code.replace(/\.eq\('team',/g, `.eq('match_id', matchId).eq('team',`);

    // 6. Delete operations
    code = code.replace(
        /await supabase\.from\('commentary'\)\.delete\(\)\.neq\('id', 0\);/g,
        `await supabase.from('commentary').delete().eq('match_id', matchId).neq('id', 0);`
    );
    code = code.replace(
        /await supabase\.from\('roster'\)\.delete\(\)\.neq\('team', 'placeholder_to_delete_all'\);/g,
        `await supabase.from('roster').delete().eq('match_id', matchId).neq('team', 'placeholder_to_delete_all');`
    );
    code = code.replace(
        /await supabase\.from\('commentary'\)\.delete\(\)\.eq\('id', id\);/g,
        `await supabase.from('commentary').delete().eq('match_id', matchId).eq('id', id);`
    );

    // 7. Insert operations
    code = code.replace(
        /await supabase\.from\('commentary'\)\.insert\(\[\{/g,
        `await supabase.from('commentary').insert([{ match_id: matchId, `
    );
    code = code.replace(
        /await supabase\.from\('commentary'\)\.insert\(\[timelinePayload\]\);/g,
        `await supabase.from('commentary').insert([{ match_id: matchId, ...timelinePayload }]);`
    );
    code = code.replace(
        /await supabase\.from\('roster'\)\.insert\(inning2Rows\);/g,
        `await supabase.from('roster').insert(inning2Rows.map(r => ({ ...r, match_id: matchId })));`
    );
    code = code.replace(
        /await supabase\.from\('roster'\)\.insert\(rosterPayload\);/g,
        `await supabase.from('roster').insert(rosterPayload.map(r => ({ ...r, match_id: matchId })));`
    );

    fs.writeFileSync(file, code);
    console.log("Successfully patched AdminView.jsx");
} catch (e) {
    console.error(e);
}
